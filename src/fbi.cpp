#include "fbi.h"

#include <optional>

struct TAFBIFile::impl
{

  std::string::const_iterator f_m, l_m;

  void parse(const std::string& input)
  {
    f_m = std::begin(input);
    l_m = std::end(input);

    skip_blanks();



  }

  void skip_blanks()
  {
    char c;
    while (is_blank(c));

  }


  std::optional<char> is_blank()
  {
    return is_match(' ', c) || is_match('\t') || is_match('\r') || is_match('\t');
  }

  std::optional<char> is_header_start()
  {
    return is_match('[');
  }

  std::optional<char> is_match(char x)
  {
    if (f_m == l_m || *f_m != x) return {};
    ++f_m;
    return {x};
  }

};


TAFBIFile::TAFBIFile(const std::string& input)
  : _pimpl(std::make_unique<impl>())
{
}

TAFBIFile::~TAFBIFile()
{
}

